import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Checkbox } from 'primereact/checkbox';
import { Menu } from 'primereact/menu';
import 'primereact/resources/themes/vela-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import './DataTableComponent.css';

// Service untuk generate data
const generateRouteData = () => {
    const routes = ['KL 7', 'KL 8', 'KL 9', 'KL 10', 'KL 11', 'KL 12'];
    const warehouses = ['3pvk04', '3pvk05', '3pvk06', '3pvk07', '3pvk08'];
    const shifts = ['AM', 'PM', 'Night'];
    const locations = ['KPJ Damansara', 'KPJ Ampang', 'KPJ Seremban', 'KPJ Ipoh', 'KPJ Johor', 'KPJ Penang', 'KPJ Rawang', 'KPJ Klang'];
    const deliveryTypes = ['Daily', 'Weekly', 'Monthly'];
    
    return Array.from({ length: 10 }).map((_, i) => {
        // Generate deliveries for this route (5-10 deliveries per route)
        const numDeliveries = 5 + Math.floor(Math.random() * 6);
        const routeDeliveries = Array.from({ length: numDeliveries }).map((_, j) => ({
            no: j + 1,
            code: (i * 10) + j + 40,
            location: locations[Math.floor(Math.random() * locations.length)],
            delivery: deliveryTypes[Math.floor(Math.random() * deliveryTypes.length)]
        }));
        
        return {
            id: i + 1,
            route: routes[Math.floor(Math.random() * routes.length)],
            warehouse: warehouses[Math.floor(Math.random() * warehouses.length)],
            shift: shifts[Math.floor(Math.random() * shifts.length)],
            deliveries: routeDeliveries
        };
    });
};

// Service untuk generate delivery data
const generateDeliveryData = () => {
    const locations = ['KPJ Damansara', 'KPJ Ampang', 'KPJ Seremban', 'KPJ Ipoh', 'KPJ Johor', 'KPJ Penang', 'KPJ Rawang', 'KPJ Klang'];
    const deliveryTypes = ['Daily', 'Weekly', 'Monthly'];
    
    return Array.from({ length: 20 }).map((_, i) => ({
        no: i + 1,
        code: 40 + i,
        location: locations[Math.floor(Math.random() * locations.length)],
        delivery: deliveryTypes[Math.floor(Math.random() * deliveryTypes.length)]
    }));
};

export default function DataTableComponent() {
    const [routes, setRoutes] = useState([]);
    const [lockedRoutes, setLockedRoutes] = useState([]);
    const [dialogVisible, setDialogVisible] = useState(false);
    const [columnDialogVisible, setColumnDialogVisible] = useState(false);
    const [rowDialogVisible, setRowDialogVisible] = useState(false);
    const [deliveries, setDeliveries] = useState([]);
    const [filteredDeliveries, setFilteredDeliveries] = useState([]);
    const [tempDeliveries, setTempDeliveries] = useState([]);
    const [selectedRoute, setSelectedRoute] = useState(null);
    const [isMaximized, setIsMaximized] = useState(false);
    const inputRefs = useRef({});
    const menuRef = useRef(null);
    const [searchValue, setSearchValue] = useState('');
    const [rowCount, setRowCount] = useState(20);
    const [rowInputValue, setRowInputValue] = useState('20');
    const [columns, setColumns] = useState([
        { field: 'no', header: 'No', visible: true },
        { field: 'code', header: 'Code', visible: true },
        { field: 'location', header: 'Location', visible: true },
        { field: 'delivery', header: 'Delivery', visible: true },
        { field: 'action', header: 'Action', visible: true }
    ]);

    useEffect(() => {
        const data = generateRouteData();
        setRoutes(data);

        setLockedRoutes([
            {
                id: 1,
                route: 'KL 7',
                warehouse: '3pvk04',
                shift: 'PM',
                deliveries: data[0]?.deliveries || []
            }
        ]);
    }, []);

    const onSearch = (e) => {
        const value = e.target.value.toLowerCase();
        setSearchValue(value);
        
        if (!selectedRoute) return;
        
        if (value === '') {
            setFilteredDeliveries(selectedRoute.deliveries);
        } else {
            const filtered = selectedRoute.deliveries.filter(item => 
                item.code.toString().includes(value) ||
                item.location.toLowerCase().includes(value) ||
                item.delivery.toLowerCase().includes(value)
            );
            setFilteredDeliveries(filtered);
        }
    };

    const toggleColumnVisibility = (field) => {
        setColumns(columns.map(col => 
            col.field === field ? { ...col, visible: !col.visible } : col
        ));
    };

    const moveColumn = (index, direction) => {
        const newColumns = [...columns];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        
        if (targetIndex >= 0 && targetIndex < columns.length) {
            [newColumns[index], newColumns[targetIndex]] = [newColumns[targetIndex], newColumns[index]];
            setColumns(newColumns);
        }
    };

    const lockTemplate = (rowData, options) => {
        const icon = options.frozenRow ? 'pi pi-lock' : 'pi pi-lock-open';
        const disabled = options.frozenRow ? false : lockedRoutes.length >= 2;

        return <Button type="button" icon={icon} disabled={disabled} className="p-button-sm p-button-text" onClick={() => toggleLock(rowData, options.frozenRow, options.rowIndex)} />;
    };

    const toggleLock = (data, frozen, index) => {
        let _lockedRoutes, _unlockedRoutes;

        if (frozen) {
            _lockedRoutes = lockedRoutes.filter((c, i) => i !== index);
            _unlockedRoutes = [...routes, data];
        } else {
            _unlockedRoutes = routes.filter((c, i) => i !== index);
            _lockedRoutes = [...lockedRoutes, data];
        }

        _unlockedRoutes.sort((val1, val2) => {
            return val1.id < val2.id ? -1 : 1;
        });

        setLockedRoutes(_lockedRoutes);
        setRoutes(_unlockedRoutes);
    };

    const adjustRowCount = (direction) => {
        const newCount = direction === 'up' ? rowCount + 1 : Math.max(1, rowCount - 1);
        setRowCount(newCount);
        setRowInputValue(newCount.toString());
        updateDeliveryData(newCount);
    };

    const handleRowInputChange = (e) => {
        const value = e.target.value;
        setRowInputValue(value);
        
        const numValue = parseInt(value);
        if (!isNaN(numValue) && numValue > 0 && numValue <= 1000) {
            setRowCount(numValue);
            updateDeliveryData(numValue);
        }
    };

    const openRowDialog = () => {
        setTempDeliveries([...filteredDeliveries]);
        setRowDialogVisible(true);
    };

    const handleOrderBlur = (rowIndex) => {
        const input = inputRefs.current[rowIndex];
        if (!input) return;
        
        const value = input.value.trim();
        const orderNum = parseInt(value);
        
        // If invalid or empty, just ignore and keep it empty
        if (value === '' || isNaN(orderNum) || orderNum < 1 || orderNum > tempDeliveries.length) {
            return;
        }
        
        // Only reorder if different position
        if (orderNum - 1 === rowIndex) {
            return;
        }
        
        const newData = [...tempDeliveries];
        const item = newData[rowIndex];
        
        // Remove item from current position
        newData.splice(rowIndex, 1);
        
        // Insert at new position (orderNum - 1 because array is 0-indexed)
        newData.splice(orderNum - 1, 0, item);
        
        setTempDeliveries(newData);
        
        // Clear all input fields
        Object.values(inputRefs.current).forEach(input => {
            if (input) input.value = '';
        });
    };

    const applyRowOrder = () => {
        // Update "no" field to reflect new order
        const reorderedData = tempDeliveries.map((item, index) => ({
            ...item,
            no: index + 1
        }));
        
        setFilteredDeliveries(reorderedData);
        setDeliveries(reorderedData);
        setRowDialogVisible(false);
    };

    const updateDeliveryData = (count) => {
        const locations = ['KPJ Damansara', 'KPJ Ampang', 'KPJ Seremban', 'KPJ Ipoh', 'KPJ Johor', 'KPJ Penang', 'KPJ Rawang', 'KPJ Klang'];
        const deliveryTypes = ['Daily', 'Weekly', 'Monthly'];
        
        const newData = Array.from({ length: count }).map((_, i) => ({
            no: i + 1,
            code: 40 + i,
            location: locations[Math.floor(Math.random() * locations.length)],
            delivery: deliveryTypes[Math.floor(Math.random() * deliveryTypes.length)]
        }));
        
        // Sort by code as default
        newData.sort((a, b) => a.code - b.code);
        
        // Reassign no after sorting
        newData.forEach((item, index) => {
            item.no = index + 1;
        });
        
        setDeliveries(newData);
        
        // Apply current search filter
        if (searchValue === '') {
            setFilteredDeliveries(newData);
        } else {
            const filtered = newData.filter(item => 
                item.code.toString().includes(searchValue.toLowerCase()) ||
                item.location.toLowerCase().includes(searchValue.toLowerCase()) ||
                item.delivery.toLowerCase().includes(searchValue.toLowerCase())
            );
            setFilteredDeliveries(filtered);
        }
    };

    const actionBodyTemplate = (rowData, options) => {
        const icon = options.frozenRow ? 'pi pi-bookmark-fill' : 'pi pi-bookmark';
        const disabled = options.frozenRow ? false : lockedRoutes.length >= 2;

        const openFlexTable = () => {
            setSelectedRoute(rowData);
            setFilteredDeliveries(rowData.deliveries);
            setSearchValue('');
            setDialogVisible(true);
        };

        return (
            <div className="action-buttons">
                <Button icon="pi pi-list" className="p-button-sm p-button-text icon-only" onClick={openFlexTable} />
                <Button type="button" icon={icon} disabled={disabled} className="p-button-sm p-button-text icon-only" onClick={() => toggleLock(rowData, options.frozenRow, options.rowIndex)} />
            </div>
        );
    };

    const deliveryActionBodyTemplate = () => {
        return (
            <div className="action-buttons">
                <Button icon="pi pi-info-circle" className="p-button-sm p-button-text icon-only" />
                <Button icon="pi pi-power-off" className="p-button-sm p-button-text icon-only" />
            </div>
        );
    };

    const dialogFooterTemplate = () => {
        return <Button label="Close" icon="pi pi-times" onClick={() => setDialogVisible(false)} className="p-button-outlined" />;
    };

    const columnDialogFooterTemplate = () => {
        return <Button label="Close" icon="pi pi-times" onClick={() => setColumnDialogVisible(false)} className="p-button-outlined" />;
    };

    const rowDialogFooterTemplate = () => {
        return (
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <Button label="Apply" icon="pi pi-check" onClick={applyRowOrder} />
                <Button label="Cancel" icon="pi pi-times" onClick={() => setRowDialogVisible(false)} className="p-button-outlined" />
            </div>
        );
    };

    const dialogHeader = () => {
        const menuItems = [
            {
                label: isMaximized ? 'Exit Fullscreen' : 'Fullscreen',
                icon: isMaximized ? 'pi pi-window-minimize' : 'pi pi-window-maximize',
                command: () => setIsMaximized(!isMaximized)
            },
            {
                label: 'Row Settings',
                icon: 'pi pi-table',
                command: () => openRowDialog()
            },
            {
                label: 'Column Settings',
                icon: 'pi pi-sliders-h',
                command: () => setColumnDialogVisible(true)
            }
        ];

        return (
            <div className="dialog-header-container">
                <span>Delivery List{selectedRoute ? ` - ${selectedRoute.route} (${selectedRoute.warehouse}, ${selectedRoute.shift})` : ''}</span>
                <div className="dialog-header-actions">
                    <span className="p-input-icon-left">
                        <i className="pi pi-search" />
                        <InputText 
                            value={searchValue} 
                            onChange={onSearch} 
                            placeholder="Search..." 
                            className="search-input"
                            autoFocus={false}
                        />
                    </span>
                    <Menu model={menuItems} popup ref={menuRef} className="dark-menu" />
                    <Button 
                        icon="pi pi-bars" 
                        className="p-button-sm p-button-text" 
                        onClick={(e) => menuRef.current.toggle(e)}
                        tooltip="Menu"
                    />
                </div>
            </div>
        );
    };

    return (
        <div className="datatable-container">
            <nav className="nav-header">
                <div className="nav-content">
                    <div className="nav-brand">
                        <i className="pi pi-map-marker" style={{ fontSize: '1.5rem' }}></i>
                        <span className="nav-title">Mappmarrker</span>
                    </div>
                    <div className="nav-actions">
                        <Button icon="pi pi-bell" className="p-button-text p-button-rounded" />
                        <Button icon="pi pi-user" className="p-button-text p-button-rounded" />
                    </div>
                </div>
            </nav>

            <div className="content-wrapper">
                <DataTable 
                    value={routes} 
                    frozenValue={lockedRoutes}
                    scrollable 
                    scrollHeight="600px"
                    tableStyle={{ minWidth: '50rem' }}
                    className="dark-table"
                >
                    <Column field="route" header="Route" headerStyle={{ textAlign: 'center' }} bodyStyle={{ textAlign: 'center' }}></Column>
                    <Column field="warehouse" header="Warehouse" headerStyle={{ textAlign: 'center' }} bodyStyle={{ textAlign: 'center' }}></Column>
                    <Column field="shift" header="Shift" headerStyle={{ textAlign: 'center' }} bodyStyle={{ textAlign: 'center' }}></Column>
                    <Column header="Action" body={actionBodyTemplate} headerStyle={{ textAlign: 'center' }} bodyStyle={{ textAlign: 'center' }}></Column>
                </DataTable>
            </div>

            <Dialog 
                header={dialogHeader}
                visible={dialogVisible} 
                style={isMaximized ? { width: '100vw', height: '100vh' } : { width: '75vw' }} 
                modal 
                dismissableMask
                closable={false}
                contentStyle={{ height: '400px' }} 
                onHide={() => {
                    setDialogVisible(false);
                    setIsMaximized(false);
                }} 
                footer={dialogFooterTemplate}
                className="dark-dialog"
            >
                <DataTable 
                    value={filteredDeliveries} 
                    scrollable 
                    scrollHeight="flex" 
                    tableStyle={{ minWidth: '50rem' }}
                    className="dark-table"
                >
                    {columns.filter(col => col.visible).map((col) => {
                        if (col.field === 'action') {
                            return <Column key={col.field} header={col.header} body={deliveryActionBodyTemplate} headerStyle={{ textAlign: 'center' }} bodyStyle={{ textAlign: 'center' }}></Column>;
                        }
                        return <Column key={col.field} field={col.field} header={col.header} headerStyle={{ textAlign: 'center' }} bodyStyle={{ textAlign: 'center' }}></Column>;
                    })}
                </DataTable>
            </Dialog>

            <Dialog 
                header="Column Settings"
                visible={columnDialogVisible} 
                style={{ width: '400px', borderRadius: '24px' }} 
                modal 
                dismissableMask
                closable={false}
                onHide={() => setColumnDialogVisible(false)} 
                footer={columnDialogFooterTemplate}
                className="dark-dialog"
            >
                <div className="column-settings">
                    {columns.map((col, index) => (
                        <div key={col.field} className="column-item">
                            <div className="column-item-left">
                                <Checkbox 
                                    inputId={col.field} 
                                    checked={col.visible} 
                                    onChange={() => toggleColumnVisibility(col.field)}
                                />
                                <label htmlFor={col.field} className="column-label">{col.header}</label>
                            </div>
                            <div className="column-item-right">
                                <Button 
                                    icon="pi pi-chevron-up" 
                                    className="p-button-sm p-button-text"
                                    onClick={() => moveColumn(index, 'up')}
                                    disabled={index === 0}
                                />
                                <Button 
                                    icon="pi pi-chevron-down" 
                                    className="p-button-sm p-button-text"
                                    onClick={() => moveColumn(index, 'down')}
                                    disabled={index === columns.length - 1}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </Dialog>

            <Dialog 
                header="Row Settings"
                visible={rowDialogVisible} 
                style={{ width: '75vw', borderRadius: '24px' }} 
                maximizable
                modal 
                dismissableMask
                closable={false}
                contentStyle={{ height: '400px' }} 
                onHide={() => setRowDialogVisible(false)} 
                footer={rowDialogFooterTemplate}
                className="dark-dialog"
            >
                <div className="row-preview-container">
                    <p className="row-preview-hint">Enter order number (1-{tempDeliveries.length}) to reorder rows. Changes will apply after clicking Apply button.</p>
                    <DataTable 
                        value={tempDeliveries} 
                        scrollable 
                        scrollHeight="flex" 
                        tableStyle={{ width: '100%' }}
                        className="dark-table row-preview-table"
                    >
                        <Column 
                            header="Order" 
                            body={(rowData, options) => (
                                <div className="row-order-input">
                                    <InputText 
                                        ref={(el) => inputRefs.current[options.rowIndex] = el}
                                        defaultValue=""
                                        onBlur={() => handleOrderBlur(options.rowIndex)}
                                        className="order-input"
                                        inputMode="numeric"
                                        placeholder={(options.rowIndex + 1).toString()}
                                    />
                                </div>
                            )}
                            headerStyle={{ textAlign: 'center', width: '90px' }} 
                            bodyStyle={{ textAlign: 'center' }}
                        ></Column>
                        {columns.filter(col => col.visible && col.field !== 'action' && col.field !== 'no').map((col) => {
                            const style = { textAlign: 'center' };
                            if (col.field === 'code') {
                                style.width = '80px';
                            } else if (col.field === 'location') {
                                style.width = 'auto';
                            } else if (col.field === 'delivery') {
                                style.width = '100px';
                            }
                            return (
                                <Column 
                                    key={col.field} 
                                    field={col.field} 
                                    header={col.header} 
                                    headerStyle={style} 
                                    bodyStyle={style}
                                ></Column>
                            );
                        })}
                    </DataTable>
                </div>
            </Dialog>
        </div>
    );
}
